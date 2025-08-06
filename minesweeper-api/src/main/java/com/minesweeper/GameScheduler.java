package com.minesweeper;

import com.minesweeper.entity.Game;
import com.minesweeper.entity.Mine;
import com.minesweeper.repository.GameRepository;
import com.minesweeper.repository.MineRepository;
import io.quarkus.scheduler.Scheduled;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.time.temporal.WeekFields;
import java.util.*;

public class GameScheduler {

    @Inject
    GameRepository gameRepository;

    @Inject
    MineRepository mineRepository;

    @Scheduled(every = "5m")
    @Transactional
    void schedule() {
        LocalDateTime now = LocalDateTime.now();

        closeExpiredGames(now);
        createDailyGame(now);
        createWeeklyGame(now);
        createMonthlyGame(now);
    }

    private void closeExpiredGames(LocalDateTime now) {
        List<Game> games = gameRepository.list("endDate < ?1", now);
        for (Game g : games) {
            long remaining = mineRepository.count("game = ?1 and foundBy is null and (exploded is null or exploded = false)", g);
            if (remaining > 0) {
                mineRepository.update("exploded = true where game = ?1 and foundBy is null and (exploded is null or exploded = false)", g);
            }
        }
    }

    private void createDailyGame(LocalDateTime now) {
        boolean exists = gameRepository.count("title like ?1 and startDate <= ?2 and endDate >= ?2", "Daily #%", now) > 0;
        if (exists) {
            return;
        }
        Game game = new Game();
        game.setId(UUID.randomUUID().toString());
        game.setTitle("Daily # " + now.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        game.setWidth(100);
        game.setHeight(75);
        game.setMineCount(5);
        game.setStartDate(now);
        LocalDateTime end = now.withHour(1).withMinute(0).withSecond(0).withNano(0);
        if (!end.isAfter(now)) {
            end = end.plusDays(1);
        }
        game.setEndDate(end);
        gameRepository.persist(game);
        createMines(game, 100, 75, 5);
    }

    private void createWeeklyGame(LocalDateTime now) {
        boolean exists = gameRepository.count("title like ?1 and startDate <= ?2 and endDate >= ?2", "Weekly #%", now) > 0;
        if (exists) {
            return;
        }
        Game game = new Game();
        game.setId(UUID.randomUUID().toString());
        int week = now.get(WeekFields.ISO.weekOfWeekBasedYear());
        game.setTitle("Weekly # " + week);
        game.setWidth(400);
        game.setHeight(200);
        game.setMineCount(25);
        game.setStartDate(now);
        LocalDateTime end = now.with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY)).withHour(1).withMinute(0).withSecond(0).withNano(0);
        if (!end.isAfter(now)) {
            end = end.plusWeeks(1);
        }
        game.setEndDate(end);
        gameRepository.persist(game);
        createMines(game, 400, 200, 25);
    }

    private void createMonthlyGame(LocalDateTime now) {
        boolean exists = gameRepository.count("title like ?1 and startDate <= ?2 and endDate >= ?2", "Monthly #%", now) > 0;
        if (exists) {
            return;
        }
        Game game = new Game();
        game.setId(UUID.randomUUID().toString());
        game.setTitle("Monthly # " + now.format(DateTimeFormatter.ofPattern("MM/yyyy")));
        game.setWidth(2000);
        game.setHeight(1250);
        game.setMineCount(150);
        game.setStartDate(now);
        LocalDate firstNext = now.toLocalDate().with(TemporalAdjusters.firstDayOfNextMonth());
        LocalDateTime end = LocalDateTime.of(firstNext, LocalTime.of(1, 0));
        game.setEndDate(end);
        gameRepository.persist(game);
        createMines(game, 2000, 1250, 150);
    }

    private void createMines(Game game, int width, int height, int mineCount) {
        Random random = new Random();
        Set<String> positions = new HashSet<>();
        while (positions.size() < mineCount) {
            int x = random.nextInt(width);
            int y = random.nextInt(height);
            String key = x + ":" + y;
            if (positions.add(key)) {
                Mine mine = new Mine();
                mine.setId(UUID.randomUUID().toString());
                mine.setGame(game);
                mine.setX(x);
                mine.setY(y);
                mine.setExploded(false);
                mineRepository.persist(mine);
            }
        }
    }
}
