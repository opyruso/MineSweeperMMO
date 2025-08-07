package com.minesweeper.repository;

import com.minesweeper.entity.PaymentTracking;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PaymentTrackingRepository implements PanacheRepositoryBase<PaymentTracking, Long> {
}
