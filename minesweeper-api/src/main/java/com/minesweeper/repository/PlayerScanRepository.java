package com.minesweeper.repository;

import com.minesweeper.entity.PlayerScan;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PlayerScanRepository implements PanacheRepository<PlayerScan> {
}

