package com.minesweeper;

import com.minesweeper.entity.Player;
import com.minesweeper.entity.PlayerData;
import com.minesweeper.repository.PlayerDataRepository;
import com.minesweeper.repository.PlayerRepository;
import io.quarkus.scheduler.Scheduled;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;

public class DailyIncomeScheduler {

    @Inject
    PlayerRepository playerRepository;

    @Inject
    PlayerDataRepository playerDataRepository;

    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    void addDailyIncome() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(72);
        List<Player> players = playerRepository.list("dateLastConnexion > ?1", threshold);
        for (Player p : players) {
            PlayerData data = playerDataRepository.findById(p.getId());
            if (data == null) {
                data = new PlayerData();
                data.setIdPlayer(p.getId());
                data.setReputation(0);
                data.setGold(50);
                data.setScanRangeMax(10);
                data.setIncomePerDay(50);
                playerDataRepository.persist(data);
            }
            data.setGold(data.getGold() + data.getIncomePerDay());
        }
    }
}
