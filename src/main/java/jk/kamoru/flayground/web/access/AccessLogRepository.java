package jk.kamoru.flayground.web.access;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AccessLogRepository extends JpaRepository<AccessLogStatistic, String> {

}
