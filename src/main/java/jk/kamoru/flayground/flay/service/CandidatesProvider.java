package jk.kamoru.flayground.flay.service;

import java.io.File;
import java.util.Collection;
import java.util.List;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jk.kamoru.flayground.FlayConfig;
import jk.kamoru.flayground.flay.domain.Flay;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class CandidatesProvider {

	@Value("${path.video.candidate}") String candidatePath;
	@Value("${path.video.stage}")     String[]   stagePaths;
	
	Collection<File> listFiles;
	
	public void initiate() {
		listFiles = FileUtils.listFiles(new File(candidatePath), FlayConfig.SUFFIX_VIDEO.split(","), true);
		log.info("candidates {} found", listFiles.size());
	}

	public boolean findAndFill(Flay flay) {
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

	public boolean accept(Flay flay) {
		List<File> movieList = flay.getFiles().get(Flay.MOVIE);
		List<File> candidateList = flay.getFiles().get(Flay.CANDI);
		
		if (candidateList.size() == 0) {
			return false;
		}

		File parentFile = null;
		if (movieList.size() > 0) {
			parentFile = flay.getFiles().get(Flay.MOVIE).get(0).getParentFile();
		} else {
			parentFile = new File(stagePaths[0]);
		}

		String prefix = flay.getFullname();
		if (movieList.size() + candidateList.size() > 1) {
			int fileCount = 0;
			for (File file : movieList) {
				String suffix = FilenameUtils.getExtension(file.getName());
				File desc = new File(parentFile, prefix + ++fileCount + "." + suffix);
				log.info("{} renameTo {}", file, desc);
				file.renameTo(desc);
			}
			for (File file : candidateList) {
				String suffix = FilenameUtils.getExtension(file.getName());
				File desc = new File(parentFile, prefix + ++fileCount + "." + suffix);
				log.info("{} renameTo {}", file, desc);
				file.renameTo(desc);
			}
		} else {
			File file = candidateList.get(0);
			String suffix = FilenameUtils.getExtension(file.getName());
			File desc = new File(parentFile, prefix + "." + suffix);
			log.info("{} renameTo {}", file, desc);
			file.renameTo(desc);
		}
		
		return true;
	}

}
