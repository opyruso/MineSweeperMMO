package com.minesweeper.repository;

import com.minesweeper.entity.Mine;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class MineRepository implements PanacheRepository<Mine> {
}

