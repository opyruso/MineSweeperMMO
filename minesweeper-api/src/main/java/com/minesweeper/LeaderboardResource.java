package com.minesweeper;

import com.minesweeper.dto.LeaderboardInfo;
import com.minesweeper.repository.MineRepository;
import com.minesweeper.repository.PlayerScanRepository;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Path("/leaderboard")
@Produces(MediaType.APPLICATION_JSON)
public class LeaderboardResource {

    @Inject
    MineRepository mineRepository;

    @Inject
    PlayerScanRepository playerScanRepository;

    @GET
    @Path("/{period}")
    @Authenticated
    public List<LeaderboardInfo> getLeaderboard(@PathParam("period") String period) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start;
        LocalDateTime end;
        switch (period) {
            case "daily" -> {
                start = now.withHour(1).withMinute(0).withSecond(0).withNano(0);
                if (now.isBefore(start)) {
                    start = start.minusDays(1);
                }
                end = start.plusDays(1);
            }
            case "weekly" -> {
                start = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                        .withHour(1).withMinute(0).withSecond(0).withNano(0);
                if (now.isBefore(start)) {
                    start = start.minusWeeks(1);
                }
                end = start.plusWeeks(1);
            }
            case "monthly" -> {
                start = now.withDayOfMonth(1).withHour(1).withMinute(0).withSecond(0).withNano(0);
                if (now.isBefore(start)) {
                    start = start.minusMonths(1);
                }
                end = start.plusMonths(1);
            }
            default -> throw new NotFoundException();
        }

        Map<String, Integer> scores = new HashMap<>();
        Map<String, String> names = new HashMap<>();

        List<Object[]> defused = mineRepository.getEntityManager().createQuery(
                "select m.foundBy.id, m.foundBy.name, count(m) from Mine m " +
                        "where m.foundDate >= :start and m.foundDate < :end " +
                        "and m.exploded = false and m.foundBy is not null " +
                        "group by m.foundBy.id, m.foundBy.name", Object[].class)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();
        for (Object[] row : defused) {
            String id = (String) row[0];
            String name = (String) row[1];
            Long count = (Long) row[2];
            names.put(id, name);
            scores.merge(id, (int) (count * 10), Integer::sum);
        }

        List<Object[]> exploded = mineRepository.getEntityManager().createQuery(
                "select m.foundBy.id, m.foundBy.name, count(m) from Mine m " +
                        "where m.foundDate >= :start and m.foundDate < :end " +
                        "and m.exploded = true and m.foundBy is not null " +
                        "group by m.foundBy.id, m.foundBy.name", Object[].class)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();
        for (Object[] row : exploded) {
            String id = (String) row[0];
            String name = (String) row[1];
            Long count = (Long) row[2];
            names.put(id, name);
            scores.merge(id, (int) (-50 * count), Integer::sum);
        }

        List<Object[]> scans = playerScanRepository.getEntityManager().createQuery(
                "select ps.player.id, ps.player.name, count(ps) from PlayerScan ps " +
                        "where ps.scanDate >= :start and ps.scanDate < :end " +
                        "group by ps.player.id, ps.player.name", Object[].class)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();
        for (Object[] row : scans) {
            String id = (String) row[0];
            String name = (String) row[1];
            Long count = (Long) row[2];
            names.put(id, name);
            scores.merge(id, count.intValue(), Integer::sum);
        }

        return names.entrySet().stream()
                .map(e -> new LeaderboardInfo(e.getValue(), scores.getOrDefault(e.getKey(), 0)))
                .sorted((a, b) -> Integer.compare(b.points(), a.points()))
                .toList();
    }
}
