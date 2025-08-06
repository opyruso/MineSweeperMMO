package com.minesweeper;

import com.minesweeper.dto.PlayerDataInfo;
import com.minesweeper.dto.AddGoldRequest;
import com.minesweeper.entity.PlayerData;
import com.minesweeper.repository.PlayerDataRepository;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Path("/player-data")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PlayerDataResource {

    @Inject
    PlayerDataRepository playerDataRepository;

    @Inject
    JsonWebToken jwt;


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
    @Path("/me")
    @Authenticated
    @Transactional
    public PlayerDataInfo me() {
        String id = jwt.getSubject();
        PlayerData data = getOrCreate(id);
        return new PlayerDataInfo(data.getReputation(), data.getGold(), data.getScanRangeMax(), data.getIncomePerDay());
        }

    @POST
    @Path("/me/upgrade-scan")
    @Authenticated
    @Transactional
    public PlayerDataInfo upgradeScan() {
        String id = jwt.getSubject();
        PlayerData data = getOrCreate(id);
        int cost = (int) Math.pow(2, data.getScanRangeMax() - 9);
        if (data.getGold() < cost) {
            throw new BadRequestException();
        }
        data.setGold(data.getGold() - cost);
        data.setScanRangeMax(data.getScanRangeMax() + 1);
        return new PlayerDataInfo(data.getReputation(), data.getGold(), data.getScanRangeMax(), data.getIncomePerDay());
    }

    @POST
    @Path("/me/upgrade-income")
    @Authenticated
    @Transactional
    public PlayerDataInfo upgradeIncome() {
        String id = jwt.getSubject();
        PlayerData data = getOrCreate(id);
        int cost = (int) Math.pow(2, (data.getIncomePerDay() - 50) / 10);
        if (data.getGold() < cost) {
            throw new BadRequestException();
        }
        data.setGold(data.getGold() - cost);
        data.setIncomePerDay(data.getIncomePerDay() + 10);
        return new PlayerDataInfo(data.getReputation(), data.getGold(), data.getScanRangeMax(), data.getIncomePerDay());
    }

    @POST
    @Path("/me/add-gold")
    @Authenticated
    @Transactional
    public PlayerDataInfo addGold(AddGoldRequest request) {
        String id = jwt.getSubject();
        PlayerData data = getOrCreate(id);
        data.setGold(data.getGold() + Math.max(0, request.amount()));
        return new PlayerDataInfo(data.getReputation(), data.getGold(), data.getScanRangeMax(), data.getIncomePerDay());
    }
}
