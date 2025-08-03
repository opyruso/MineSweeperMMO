package com.minesweeper;

import com.minesweeper.dto.GameInfo;
import com.minesweeper.dto.NewGameRequest;
import com.minesweeper.entity.Game;
import com.minesweeper.entity.Mine;
import com.minesweeper.repository.GameRepository;
import com.minesweeper.repository.MineRepository;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.time.LocalDateTime;
import java.util.*;

@Path("/games")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class GameResource {

    @Inject
    GameRepository gameRepository;

    @Inject
    MineRepository mineRepository;

    @GET
    @Authenticated
    public List<GameInfo> listGames() {
        return gameRepository.listOngoing().stream()
                .map(g -> new GameInfo(g.getId(), g.getTitle(), g.getWidth(), g.getHeight()))
                .toList();
    }

    @POST
    @Path("/new")
    @RolesAllowed("admin")
    @Transactional
    public GameInfo createGame(NewGameRequest request) {
        Game game = new Game();
        game.setId(UUID.randomUUID().toString());
        game.setTitle(request.title());
        game.setWidth(request.width());
        game.setHeight(request.height());
        game.setMineCount(request.mineCount());
        game.setStartDate(LocalDateTime.now());
        game.setEndDate(LocalDateTime.now().plusHours(1));
        gameRepository.persist(game);

        Random random = new Random();
        Set<String> positions = new HashSet<>();
        while (positions.size() < request.mineCount()) {
            int x = random.nextInt(request.width());
            int y = random.nextInt(request.height());
            String key = x + ":" + y;
            if (positions.add(key)) {
                Mine mine = new Mine();
                mine.setId(UUID.randomUUID().toString());
                mine.setGame(game);
                mine.setX(x);
                mine.setY(y);
                mine.setExploded(false);
                mineRepository.persist(mine);
            }
        }

        return new GameInfo(game.getId(), game.getTitle(), game.getWidth(), game.getHeight());
    }
}

