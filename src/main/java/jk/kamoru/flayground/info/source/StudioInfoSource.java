package jk.kamoru.flayground.info.source;

import java.io.File;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.type.TypeReference;

import jk.kamoru.flayground.FlayConfig;
import jk.kamoru.flayground.info.domain.Studio;

@Repository
public class StudioInfoSource extends InfoSourceJsonAdapter<Studio, String> {

	@Value("${path.info}") String infoPath;

	@Override
	File getInfoFile() {
		return new File(infoPath, FlayConfig.STUDIO_FILE_NAME);
	}

	@Override
	TypeReference<List<Studio>> getTypeReference() {
		return new TypeReference<List<Studio>>() {};
	}

	@Override
	Studio newInstance(String key) {
		return new Studio(key);
	}

}
