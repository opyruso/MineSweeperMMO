package com.minesweeper;

import com.minesweeper.entity.Player;
import com.minesweeper.repository.PlayerRepository;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Updates the player's last connection date on each authenticated request.
 */
@Provider
@Priority(Priorities.USER)
public class PlayerLastConnexionFilter implements ContainerRequestFilter {

    @Inject
    SecurityIdentity identity;

    @Inject
    JsonWebToken jwt;

    @Inject
    PlayerRepository playerRepository;

    @Override
    @Transactional
    public void filter(ContainerRequestContext requestContext) throws IOException {
        if (identity == null || identity.isAnonymous()) {
            return;
        }

        String playerId = jwt.getSubject();
        LocalDateTime now = LocalDateTime.now();
        Player player = playerRepository.findById(playerId);
        if (player == null) {
            player = new Player();
            player.setId(playerId);
            player.setName(identity.getPrincipal().getName());
            player.setDateLastConnexion(now);
            playerRepository.persist(player);
        } else {
            player.setDateLastConnexion(now);
        }
    }
}

