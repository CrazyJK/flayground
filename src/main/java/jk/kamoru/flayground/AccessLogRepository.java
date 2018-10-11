package jk.kamoru.flayground;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface AccessLogRepository extends MongoRepository<AccessLog, String> {

	long countByHandlerInfo(String string);

}
