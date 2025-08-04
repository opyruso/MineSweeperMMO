package com.minesweeper.repository;

import com.minesweeper.entity.PlayerData;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PlayerDataRepository implements PanacheRepositoryBase<PlayerData, String> {
}
