package jk.kamoru.flayground.base.web.access.service;

import java.io.File;
import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.transaction.Transactional;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.base.web.access.domain.AccessLogStatistic;
import jk.kamoru.flayground.base.web.access.repository.AccessLogRepository;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AccessLogService {

	@Autowired FlayProperties flayProperties;

	@Autowired AccessLogRepository accessLogRepository;

	ObjectMapper jsonReader = new ObjectMapper();
	ObjectWriter jsonWriter = new ObjectMapper().writerWithDefaultPrettyPrinter();

	public long countByHandler(String handlerInfo) {
		Optional<AccessLogStatistic> findById = accessLogRepository.findById(handlerInfo);
		if (findById.isPresent()) {
			return findById.get().getCallCount();
		}
		return 0;
	}

	public Optional<AccessLogStatistic> find(String handlerInfo) {
		return accessLogRepository.findById(handlerInfo);
	}

	@Transactional
	public void increaseCallCount(String handlerInfo) {
		AccessLogStatistic accessLogStatistic = accessLogRepository.findById(handlerInfo).orElse(new AccessLogStatistic(handlerInfo));
		accessLogStatistic.increaseCallCount();
		accessLogStatistic.setLastAccess(new Date());
		accessLogRepository.save(accessLogStatistic);
	}

	@Transactional
	@PostConstruct
	public void loadFromFile() {
		log.debug("@PostConstruct AccessLogService.loadFromFile");
		File infoFile = getAccessFile();
		try {
			List<AccessLogStatistic> list = jsonReader.readValue(infoFile, new TypeReference<List<AccessLogStatistic>>() {});
			accessLogRepository.saveAll(list);
			log.info(String.format("%5s %-7s - %s", list.size(), FilenameUtils.getBaseName(infoFile.getName()), infoFile));
		} catch (IOException e) {
			throw new IllegalStateException("Fail to load info file " + infoFile, e);
		}
	}

	@PreDestroy
	public void saveToFile() {
		log.debug("@PreDestroy - AccessLogService.saveToFile");
		try {
			// backup src file
			File srcFile = getAccessFile();
			File destFile = new File(srcFile.getParentFile(), srcFile.getName() + ".bak");
			FileUtils.copyFile(srcFile, destFile);
			// sava access file
			List<AccessLogStatistic> findAll = accessLogRepository.findAll();
			jsonWriter.writeValue(getAccessFile(), findAll);
			log.info("save accesslog statistic to file {}", findAll.size());
		} catch (IOException e) {
			throw new IllegalStateException("Fail to save info file " + getAccessFile(), e);
		}
	}

	private File getAccessFile() {
		return new File(flayProperties.getInfoPath(), Flayground.InfoFilename.ACCESS);
	}
}
