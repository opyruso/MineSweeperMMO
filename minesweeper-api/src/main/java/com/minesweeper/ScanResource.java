package com.minesweeper;

import com.minesweeper.dto.NewScanRequest;
import com.minesweeper.dto.ScanInfo;
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

@Path("/scans")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ScanResource {

    @Inject
    GameRepository gameRepository;

    @Inject
    PlayerRepository playerRepository;

    @Inject
    MineRepository mineRepository;

    @Inject
    PlayerScanRepository playerScanRepository;

    @GET
    @Path("/{idGame}")
    @Authenticated
    public List<ScanInfo> listScans(@PathParam("idGame") String idGame) {
        Game game = gameRepository.findById(idGame);
        if (game == null) {
            throw new NotFoundException();
        }
        return playerScanRepository.list("game", game).stream()
                .map(scan -> new ScanInfo(
                        scan.getId(),
                        scan.getPlayer().getId(),
                        scan.getX(),
                        scan.getY(),
                        scan.getScanDate(),
                        scan.getScanRange(),
                        countMines(game, scan.getX(), scan.getY(), scan.getScanRange()),
                        false))
                .toList();
    }

    @POST
    @Authenticated
    @Transactional
    public ScanInfo createScan(NewScanRequest request) {
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
        LocalDateTime now = LocalDateTime.now();
        if (mine != null) {
            mine.setExploded(true);
            int mines = countMines(game, request.x(), request.y(), request.scanRange());
            return new ScanInfo(null, player.getId(), request.x(), request.y(),
                    now, request.scanRange(), mines, true);
        }

        PlayerScan scan = new PlayerScan();
        scan.setId(UUID.randomUUID().toString());
        scan.setGame(game);
        scan.setPlayer(player);
        scan.setX(request.x());
        scan.setY(request.y());
        scan.setScanRange(request.scanRange());
        scan.setScanDate(now);
        playerScanRepository.persist(scan);

        int mines = countMines(game, request.x(), request.y(), request.scanRange());
        return new ScanInfo(scan.getId(), player.getId(), scan.getX(), scan.getY(),
                scan.getScanDate(), scan.getScanRange(), mines, false);
    }

    private int countMines(Game game, int x, int y, int range) {
        List<Mine> mines = mineRepository.list("game", game);
        int count = 0;
        for (Mine m : mines) {
            double dist = Math.hypot(m.getX() - x, m.getY() - y);
            if (dist < range) {
                count++;
            }
        }
        return count;
    }
}

