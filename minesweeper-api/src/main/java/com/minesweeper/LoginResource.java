package com.minesweeper;

import com.minesweeper.entity.Player;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDateTime;

@Path("/login")
@Produces(MediaType.APPLICATION_JSON)
public class LoginResource {

    @GET
    @Transactional
    public Response login(@QueryParam("id") String id, @QueryParam("name") String name) {
        if (id == null || id.isBlank() || name == null || name.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

        Player player = Player.findById(id);
        LocalDateTime now = LocalDateTime.now();
        if (player == null) {
            player = new Player();
            player.idPlayer = id;
            player.name = name;
            player.lastConnection = now;
            player.persist();
        } else {
            player.lastConnection = now;
            player.persist();
        }

        return Response.ok(player).build();
    }
}
