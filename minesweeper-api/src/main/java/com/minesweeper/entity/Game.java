package com.minesweeper.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "games")
public class Game extends PanacheEntityBase {

    @Id
    @GeneratedValue
    public UUID id;

    @Column(unique = true)
    public String title;

    public int width;

    public int height;

    @Column(name = "start_date")
    public LocalDateTime startDate;

    @Column(name = "end_date")
    public LocalDateTime endDate;

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL)
    public List<Mine> mines;
}
