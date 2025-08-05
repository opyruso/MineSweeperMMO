package com.minesweeper.repository;

import com.minesweeper.entity.ActionEvent;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ActionEventRepository implements PanacheRepositoryBase<ActionEvent, String> {
}
