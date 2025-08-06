package com.minesweeper;

import com.minesweeper.entity.PlayerData;
import com.minesweeper.repository.PlayerDataRepository;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Path("/checkpayment")
@Produces(MediaType.APPLICATION_JSON)
public class CheckPaymentResource {

    @Inject
    JsonWebToken jwt;

    @Inject
    PlayerDataRepository playerDataRepository;

    private PlayerData getOrCreate(String id) {
        PlayerData data = playerDataRepository.findById(id);
        if (data == null) {
            data = new PlayerData();
            data.setIdPlayer(id);
            data.setReputation(0);
            data.setGold(50);
            data.setScanRangeMax(10);
            data.setIncomePerDay(50);
            playerDataRepository.persist(data);
        }
        return data;
    }

    @GET
    @Path("/{amount}")
    @Authenticated
    @Transactional
    public Response check(@PathParam("amount") String amount) {
        if (!amount.matches("1\\.99|4\\.99|9\\.99")) {
            throw new BadRequestException();
        }
        String email = jwt.getClaim("email");
        try {
            HttpClient client = HttpClient.newHttpClient();
            String body = String.format("{\"email\":\"%s\",\"montant\":\"%s\"}", email, amount);
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:10032/check"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                String id = jwt.getSubject();
                PlayerData data = getOrCreate(id);
                int gold = switch (amount) {
                    case "1.99" -> 1000;
                    case "4.99" -> 5000;
                    case "9.99" -> 10000;
                    default -> 0;
                };
                data.setGold(data.getGold() + gold);
                return Response.ok().build();
            }
        } catch (Exception e) {
            // ignore
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }
}

