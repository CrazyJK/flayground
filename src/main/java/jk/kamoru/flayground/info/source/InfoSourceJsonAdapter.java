package jk.kamoru.flayground.info.source;

import java.io.File;
import java.io.IOException;
import java.util.List;

import javax.annotation.PostConstruct;

import org.apache.commons.io.FilenameUtils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;

import jk.kamoru.flayground.info.domain.Info;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public abstract class InfoSourceJsonAdapter<T extends Info<K>, K> extends InfoSourceAdapter<T, K> {

	ObjectMapper jsonReader = new ObjectMapper();
	ObjectWriter jsonWriter = new ObjectMapper().writerWithDefaultPrettyPrinter();

	/**
	 * json 변환 type reference
	 * @return
	 */
	abstract TypeReference<List<T>> getTypeReference();

	@PostConstruct
	void load() {
		File infoFile = getInfoFile();
		try {
			list = jsonReader.readValue(infoFile, getTypeReference());
			log.info(String.format("%5s %-7s - %s", list.size(), FilenameUtils.getBaseName(infoFile.getName()), getInfoFile()));
		} catch (IOException e) {
			throw new IllegalStateException("Fail to load info file " + infoFile, e);
		}
	}

	@Override
	synchronized void save() {
		try {
			jsonWriter.writeValue(getInfoFile(), list);
		} catch (IOException e) {
			throw new IllegalStateException("Fail to save info file " + getInfoFile(), e);
		}
	}

}
