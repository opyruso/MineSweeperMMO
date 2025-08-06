package com.minesweeper.repository;

import com.minesweeper.entity.Game;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class GameRepository implements PanacheRepositoryBase<Game, String> {

    public List<Game> listOngoing() {
        LocalDateTime now = LocalDateTime.now();
        return list("startDate <= ?1 and endDate >= ?1 order by endDate asc", now);
    }
}

