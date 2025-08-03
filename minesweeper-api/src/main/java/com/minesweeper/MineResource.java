package com.minesweeper;

import com.minesweeper.dto.ClearMineRequest;
import com.minesweeper.dto.MineInfo;
import com.minesweeper.entity.Game;
import com.minesweeper.entity.Mine;
import com.minesweeper.entity.Player;
import com.minesweeper.entity.PlayerScan;
import com.minesweeper.repository.GameRepository;
import com.minesweeper.repository.MineRepository;
import com.minesweeper.repository.PlayerRepository;
import com.minesweeper.repository.PlayerScanRepository;
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

        Mine mine = mineRepository.find("game = ?1 and x = ?2 and y = ?3", game, request.x(), request.y()).firstResult();
        if (mine != null) {
            mine.setFoundBy(player);
            mine.setExploded(false);
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
            return new MineInfo(exploded.getId(), exploded.getX(), exploded.getY(), "explosed");
        }
        return new MineInfo(null, request.x(), request.y(), "wrong");
    }
}
