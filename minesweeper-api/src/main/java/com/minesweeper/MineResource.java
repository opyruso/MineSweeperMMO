package com.minesweeper;

import com.minesweeper.dto.ClearMineRequest;
import com.minesweeper.dto.MineInfo;
import com.minesweeper.entity.Game;
import com.minesweeper.entity.Mine;
import com.minesweeper.repository.GameRepository;
import com.minesweeper.repository.MineRepository;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/mines")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MineResource {

    @Inject
    GameRepository gameRepository;

    @Inject
    MineRepository mineRepository;

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
        Mine mine = mineRepository.find("game = ?1 and x = ?2 and y = ?3", game, request.x(), request.y()).firstResult();
        if (mine == null) {
            return new MineInfo(null, request.x(), request.y(), "cleared");
        }
        mine.setExploded(true);
        return new MineInfo(mine.getId(), mine.getX(), mine.getY(), "explosed");
    }
}
