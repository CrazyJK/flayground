package jk.kamoru.flayground.base.web.access.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import jk.kamoru.flayground.base.web.access.domain.AccessLogStatistic;

public interface AccessLogRepository extends JpaRepository<AccessLogStatistic, String> {

}
