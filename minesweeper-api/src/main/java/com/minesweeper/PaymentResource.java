package com.minesweeper;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.minesweeper.entity.PaymentStatus;
import com.minesweeper.entity.PaymentTracking;
import com.minesweeper.entity.PlayerData;
import com.minesweeper.repository.PaymentTrackingRepository;
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
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

@Path("/")
@Produces(MediaType.APPLICATION_JSON)
public class PaymentResource {

    @ConfigProperty(name = "payment.token.url")
    String tokenUrl;

    @ConfigProperty(name = "payment.client.id")
    String clientId;

    @ConfigProperty(name = "payment.client.secret")
    String clientSecret;

    @ConfigProperty(name = "payment.api.url")
    String paymentApi;

    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    @Inject
    JsonWebToken jwt;

    @Inject
    PaymentTrackingRepository paymentTrackingRepository;

    @Inject
    PlayerDataRepository playerDataRepository;

    private String getToken() throws Exception {
        String body = "grant_type=client_credentials&client_id=" +
                URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                "&client_secret=" + URLEncoder.encode(clientSecret, StandardCharsets.UTF_8);
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(tokenUrl))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() == 200) {
            JsonNode node = mapper.readTree(resp.body());
            return node.get("access_token").asText();
        }
        throw new RuntimeException("Unable to retrieve token");
    }

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

    private int amountToGold(BigDecimal amount) {
        String amt = amount.stripTrailingZeros().toPlainString();
        return switch (amt) {
            case "1.99" -> 1000;
            case "4.99" -> 5000;
            case "9.99" -> 10000;
            default -> 0;
        };
    }

    @GET
    @Path("checkpayment")
    @Authenticated
    @Transactional
    public Response checkPayment() {
        String userId = jwt.getSubject();
        try {
            String token = getToken();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(paymentApi + "/payment-check/awaitingclosurepayment/" + userId))
                    .header("Authorization", "Bearer " + token)
                    .GET()
                    .build();
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            int count = 0;
            if (resp.statusCode() == 200) {
                JsonNode arr = mapper.readTree(resp.body());
                if (arr.isArray()) {
                    for (JsonNode el : arr) {
                        String id = el.get("id").asText();
                        HttpRequest closeReq = HttpRequest.newBuilder()
                                .uri(URI.create(paymentApi + "/payment-check/close/" + id + "/" + userId))
                                .header("Authorization", "Bearer " + token)
                                .PUT(HttpRequest.BodyPublishers.noBody())
                                .build();
                        HttpResponse<String> closeResp = client.send(closeReq, HttpResponse.BodyHandlers.ofString());
                        if (closeResp.statusCode() == 200) {
                            PaymentTracking tracking = paymentTrackingRepository
                                    .find("keycloakUserGuid = ?1 and status = ?2", userId, PaymentStatus.RECORDED)
                                    .firstResult();
                            if (tracking != null) {
                                PlayerData data = getOrCreate(userId);
                                data.setGold(data.getGold() + amountToGold(tracking.getAmount()));
                                tracking.setStatus(PaymentStatus.CLOSE);
                            }
                            count++;
                        }
                    }
                }
            }
            long pending = paymentTrackingRepository
                    .find("keycloakUserGuid = ?1 and status = ?2", userId, PaymentStatus.RECORDED)
                    .count();
            return Response.ok(String.format("{"valid-payment":%d,"pending-payment":%d}", count, pending)).build();
        } catch (Exception e) {
            return Response.serverError().build();
        }
    }

    @GET
    @Path("initpayment/{amount}")
    @Authenticated
    @Transactional
    public Response initPayment(@PathParam("amount") String amount) {
        if (!amount.matches("1\\.99|4\\.99|9\\.99")) {
            throw new BadRequestException();
        }
        String userId = jwt.getSubject();
        try {
            Response resp = checkPayment();
            String body = resp.getEntity().toString();
            JsonNode node = mapper.readTree(body);
            long pending = node.get("pending-payment").asLong();
            if (pending > 0) {
                return Response.status(Response.Status.CONFLICT).build();
            }
        } catch (Exception e) {
            // ignore and proceed with init
        }
        PaymentTracking tracking = new PaymentTracking();
        tracking.setKeycloakUserGuid(userId);
        tracking.setAmount(new BigDecimal(amount));
        tracking.setStatus(PaymentStatus.INIT);
        paymentTrackingRepository.persist(tracking);
        try {
            String token = getToken();
            String body = String.format("{"amount": %s, "custom": "%s"}", amount, userId);
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(paymentApi + "/paypal-ipn/init"))
                    .header("Authorization", "Bearer " + token)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                tracking.setStatus(PaymentStatus.RECORDED);
                return Response.ok().build();
            }
            return Response.serverError().build();
        } catch (Exception e) {
            return Response.serverError().build();
        }
    }
}

