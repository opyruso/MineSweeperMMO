package com.minesweeper.repository;

import com.minesweeper.entity.Mine;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class MineRepository implements PanacheRepositoryBase<Mine, String> {
}

