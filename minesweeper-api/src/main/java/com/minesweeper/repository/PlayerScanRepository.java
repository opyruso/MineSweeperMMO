package com.minesweeper.repository;

import com.minesweeper.entity.PlayerScan;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PlayerScanRepository implements PanacheRepositoryBase<PlayerScan, String> {
}

