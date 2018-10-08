package jk.kamoru.flayground.flay.service;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jk.kamoru.flayground.FlayConfig;
import jk.kamoru.flayground.flay.domain.Flay;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class CandidatesProvider {

	@Value("${path.video.candidate},${path.subtitles}") String[] candidatePaths;
	
	Collection<File> listFiles;
	
	public void find() {
		listFiles = new ArrayList<>();
		String suffix = FlayConfig.SUFFIX_VIDEO + "," + FlayConfig.SUFFIX_SUBTITLES;
		for (String path : candidatePaths) {
			Collection<File> list = FileUtils.listFiles(new File(path), suffix.split(","), true);
			listFiles.addAll(list);
		}
		log.info("candidates {} found", listFiles.size());
	}

	public boolean matchAndFill(Flay flay) {
		String key1 = flay.getOpus();
		String key2 = flay.getOpus().replace("-", "");
		boolean found = false;
		for (File file : listFiles) {
			if (StringUtils.containsAny(file.getName().toUpperCase(), key1, key2)) {
				flay.addCandidatesFile(file);
				found = true;
				log.info("{} : {}", flay.getOpus(), file);
			}
		}
		return found;
	}

}
