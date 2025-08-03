package com.minesweeper.repository;

import com.minesweeper.entity.Game;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class GameRepository implements PanacheRepository<Game> {

    public List<Game> listOngoing() {
        LocalDateTime now = LocalDateTime.now();
        return list("startDate <= ?1 and endDate >= ?1", now);
    }
}

