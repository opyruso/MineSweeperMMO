package com.minesweeper;

import com.minesweeper.dto.PlayerInfo;
import com.minesweeper.dto.UpdatePlayerRequest;
import com.minesweeper.entity.Player;
import com.minesweeper.repository.PlayerRepository;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.time.LocalDateTime;

@Path("/players")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PlayerResource {

    @Inject
    PlayerRepository playerRepository;

    @Inject
    JsonWebToken jwt;

    @GET
    @Path("/me")
    @Authenticated
    @Transactional
    public PlayerInfo me() {
        String id = jwt.getSubject();
        Player player = playerRepository.findById(id);
        if (player == null) {
            player = new Player();
            player.setId(id);
            player.setName(id);
            player.setDateLastConnexion(LocalDateTime.now());
            playerRepository.persist(player);
        }
        return new PlayerInfo(player.getId(), player.getName());
    }

    @PUT
    @Path("/me")
    @Authenticated
    @Transactional
    public PlayerInfo updateMe(UpdatePlayerRequest request) {
        String id = jwt.getSubject();
        Player player = playerRepository.findById(id);
        if (player == null) {
            player = new Player();
            player.setId(id);
            player.setDateLastConnexion(LocalDateTime.now());
            playerRepository.persist(player);
        }
        player.setName(request.name());
        return new PlayerInfo(player.getId(), player.getName());
    }
}
