package com.minesweeper;

import com.minesweeper.dto.ClearMineRequest;
import com.minesweeper.dto.MineInfo;
import com.minesweeper.entity.Game;
import com.minesweeper.entity.Mine;
import com.minesweeper.entity.Player;
import com.minesweeper.entity.PlayerScan;
import com.minesweeper.entity.PlayerData;
import com.minesweeper.repository.GameRepository;
import com.minesweeper.repository.MineRepository;
import com.minesweeper.repository.PlayerRepository;
import com.minesweeper.repository.PlayerScanRepository;
import com.minesweeper.repository.PlayerDataRepository;
import com.minesweeper.service.EventPublisher;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Path("/mines")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MineResource {

    @Inject
    GameRepository gameRepository;

    @Inject
    MineRepository mineRepository;

    @Inject
    PlayerRepository playerRepository;

    @Inject
    PlayerScanRepository playerScanRepository;

    @Inject
    PlayerDataRepository playerDataRepository;

    @Inject
    EventPublisher eventPublisher;

    @GET
    @Path("/cleared")
    @Authenticated
    public List<MineInfo> listCleared(@QueryParam("gameId") String gameId) {
        Game game = gameRepository.findById(gameId);
        if (game == null) {
            throw new NotFoundException();
        }
        return mineRepository.list("game = ?1 and (foundBy is not null or exploded = true)", game)
                .stream()
                .map(m -> new MineInfo(m.getId(), m.getX(), m.getY(), Boolean.TRUE.equals(m.getExploded()) ? "explosed" : "cleared"))
                .toList();
    }

    @POST
    @Path("/clear")
    @Authenticated
    @Transactional
    public MineInfo clear(ClearMineRequest request) {
        Game game = gameRepository.findById(request.gameId());
        if (game == null) {
            throw new NotFoundException();
        }
        Player player = playerRepository.findById(request.playerId());
        if (player == null) {
            player = new Player();
            player.setId(request.playerId());
            player.setName(request.playerId());
            player.setDateLastConnexion(LocalDateTime.now());
            playerRepository.persist(player);
        }
        PlayerData data = playerDataRepository.findById(player.getId());
        if (data == null) {
            data = new PlayerData();
            data.setIdPlayer(player.getId());
            data.setReputation(0);
            data.setGold(50);
            data.setScanRangeMax(10);
            data.setIncomePerDay(50);
            playerDataRepository.persist(data);
        }

        Mine mine = mineRepository.find("game = ?1 and x = ?2 and y = ?3", game, request.x(), request.y()).firstResult();
        if (mine != null) {
            mine.setFoundBy(player);
            mine.setExploded(false);
            data.setGold(data.getGold() + 1000);
            data.setReputation(data.getReputation() + 1);
            eventPublisher.publishGame(game.getId(), "DEFUSED", player.getId(), player.getName(),
                    new io.vertx.core.json.JsonObject()
                            .put("game-id", game.getId())
                            .put("x", request.x())
                            .put("y", request.y()));
            return new MineInfo(mine.getId(), mine.getX(), mine.getY(), "cleared");
        }

        PlayerScan scan = new PlayerScan();
        scan.setId(UUID.randomUUID().toString());
        scan.setGame(game);
        scan.setPlayer(player);
        scan.setX(request.x());
        scan.setY(request.y());
        scan.setScanRange(0);
        scan.setScanDate(LocalDateTime.now());
        playerScanRepository.persist(scan);

        Mine exploded = mineRepository.find("game = ?1 and x = ?2 and y = ?3", game, request.x(), request.y()).firstResult();
        if (exploded != null && Boolean.TRUE.equals(exploded.getExploded())) {
            data.setGold(Math.max(0, data.getGold() - 500));
            data.setReputation(Math.max(0, data.getReputation() - 10));
            eventPublisher.publishGame(game.getId(), "EXPLOSION", player.getId(), player.getName(),
                    new io.vertx.core.json.JsonObject()
                            .put("game-id", game.getId())
                            .put("x", request.x())
                            .put("y", request.y()));
            return new MineInfo(exploded.getId(), exploded.getX(), exploded.getY(), "explosed");
        }
        return new MineInfo(null, request.x(), request.y(), "wrong");
    }
}
