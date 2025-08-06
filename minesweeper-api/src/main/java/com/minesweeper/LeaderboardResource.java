package com.minesweeper;

import com.minesweeper.dto.LeaderboardInfo;
import io.quarkus.security.Authenticated;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/leaderboard")
@Produces(MediaType.APPLICATION_JSON)
public class LeaderboardResource {

    @GET
    @Path("/{period}")
    @Authenticated
    public List<LeaderboardInfo> getLeaderboard(@PathParam("period") String period) {
        return List.of();
    }
}
