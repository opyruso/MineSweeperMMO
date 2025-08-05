package com.minesweeper;

import com.minesweeper.dto.LeaderboardInfo;
import com.minesweeper.entity.ActionEvent;
import com.minesweeper.repository.ActionEventRepository;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.time.*;
import java.util.*;

@Path("/leaderboard")
@Produces(MediaType.APPLICATION_JSON)
public class LeaderboardResource {

    @Inject
    ActionEventRepository actionEventRepository;

    @GET
    @Path("/{period}")
    @Authenticated
    public List<LeaderboardInfo> getLeaderboard(@PathParam("period") String period) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start;
        switch (period.toLowerCase()) {
            case "daily" -> {
                LocalDate today = now.toLocalDate();
                start = LocalDateTime.of(today, LocalTime.of(1, 0));
                if (now.isBefore(start)) {
                    start = start.minusDays(1);
                }
            }
            case "weekly" -> {
                LocalDate date = now.toLocalDate();
                LocalDate monday = date.with(java.time.DayOfWeek.MONDAY);
                start = LocalDateTime.of(monday, LocalTime.of(1, 0));
                if (now.isBefore(start)) {
                    start = start.minusWeeks(1);
                }
            }
            case "monthly" -> {
                LocalDate first = now.toLocalDate().withDayOfMonth(1);
                start = LocalDateTime.of(first, LocalTime.of(1, 0));
                if (now.isBefore(start)) {
                    start = start.minusMonths(1);
                }
            }
            default -> throw new BadRequestException();
        }
        LocalDateTime end;
        switch (period.toLowerCase()) {
            case "daily" -> end = start.plusDays(1);
            case "weekly" -> end = start.plusWeeks(1);
            case "monthly" -> end = start.plusMonths(1);
            default -> throw new BadRequestException();
        }
        List<ActionEvent> events = actionEventRepository.list("eventDate >= ?1 and eventDate < ?2", start, end);
        Map<String, Integer> points = new HashMap<>();
        for (ActionEvent e : events) {
            int delta = switch (e.getEventType()) {
                case "SCAN_NOTHING" -> 1;
                case "SCAN_MINEDETECTED" -> 5;
                case "EXPLOSION" -> -5;
                case "DEFUSED" -> 10;
                default -> 0;
            };
            points.merge(e.getPlayer().getId(), delta, Integer::sum);
        }
        return points.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .map(e -> new LeaderboardInfo(e.getKey(), e.getValue()))
                .toList();
    }
}
