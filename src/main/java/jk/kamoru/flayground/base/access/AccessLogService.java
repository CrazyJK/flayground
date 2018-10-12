package jk.kamoru.flayground.base.access;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jk.kamoru.flayground.Flayground;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AccessLogService {

	@Value("${path.info}") String infoPath;

	@Autowired AccessLogRepository accessLogRepository;

	ObjectMapper mapper = new ObjectMapper();

	public long countByHandler(String handlerInfo) {
		Optional<AccessLogStatistic> findById = accessLogRepository.findById(handlerInfo);
		if (findById.isPresent()) {
			return findById.get().getCallCount();
		}
		return 0;
	}
	
	public void increaseCallCount(String handlerInfo) {
		AccessLogStatistic accessLogStatistic = accessLogRepository.findById(handlerInfo).orElse(new AccessLogStatistic(handlerInfo));
		accessLogStatistic.increaseCallCount();
		accessLogRepository.save(accessLogStatistic);
	}
	
	@PostConstruct
	public void loadFromFile() {
		log.info("PostConstruct AccessLogService.loadFromFile");
		File infoFile = getInfoFile();
		try {
			List<AccessLogStatistic> list = mapper.readValue(infoFile, new TypeReference<List<AccessLogStatistic>>() {});
			accessLogRepository.saveAll(list);
			log.info(String.format("%5s %-7s - %s", list.size(), FilenameUtils.getBaseName(infoFile.getName()), infoFile));
		} catch (IOException e) {
			throw new IllegalStateException("Fail to load info file " + infoFile, e);
		}	
		
	}
	
	@PreDestroy
	public void saveToFile() {
		log.info("PreDestroy AccessLogService.saveToFile");
		try {
			List<AccessLogStatistic> findAll = accessLogRepository.findAll();
			mapper.writeValue(getInfoFile(), findAll);
			log.info("save accesslog statistic file {}", findAll.size());
		} catch (IOException e) {
			throw new IllegalStateException("Fail to save info file " + getInfoFile(), e);
		}
	}

	private File getInfoFile() {
		return new File(infoPath, Flayground.ACCESS_FILE_NAME);
	}
}
