package com.minesweeper;

import com.minesweeper.dto.NewGameRequest;
import com.minesweeper.entity.Game;
import com.minesweeper.entity.Mine;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDateTime;
import java.util.*;

@Path("/games")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class GameResource {

    @GET
    public List<Game> listGames() {
        return Game.listAll();
    }

    @POST
    @Path("/new")
    @Transactional
    public Response newGame(NewGameRequest request) {
        if (request == null || request.title == null || request.title.isBlank()
                || request.width <= 0 || request.height <= 0 || request.bombs <= 0) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        if (Game.count("endDate is null") > 0) {
            return Response.status(Response.Status.CONFLICT).entity("Game already in progress").build();
        }
        Game game = new Game();
        game.id = UUID.randomUUID();
        game.title = request.title;
        game.width = request.width;
        game.height = request.height;
        game.startDate = LocalDateTime.now();
        game.persist();

        Set<String> positions = new HashSet<>();
        Random random = new Random();
        while (positions.size() < request.bombs) {
            int x = random.nextInt(request.width);
            int y = random.nextInt(request.height);
            String key = x + "," + y;
            if (positions.add(key)) {
                Mine mine = new Mine();
                mine.id = UUID.randomUUID();
                mine.game = game;
                mine.x = x;
                mine.y = y;
                mine.persist();
            }
        }

        return Response.status(Response.Status.CREATED).entity(game).build();
    }
}
