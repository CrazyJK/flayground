package jk.kamoru.flayground.flay.service;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Map.Entry;

import org.apache.commons.io.FilenameUtils;

import jk.kamoru.flayground.flay.domain.Flay;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FlayFileHandler {

	public static void rename(Flay flay, List<String> actressList) {
		rename(flay, flay.getStudio(), flay.getTitle(), actressList, flay.getRelease());
	}
	
	public static void rename(Flay flay, String studio, String title, List<String> actressList, String release) {
		flay.setStudio(studio);
		flay.setTitle(title);
		flay.setActressList(actressList);
		flay.setRelease(release);
		
		for (Entry<String, List<File>> entry : flay.getFiles().entrySet()) {
			String key = entry.getKey();
			List<File> fileList = entry.getValue();
			int fileCount = 0;
			boolean increaseCount = fileList.size() > 1;

			List<File> newFiles = new ArrayList<>();
			for (File file : fileList) {
				
				String tail   = increaseCount ? "" + ++fileCount : "";
				String suffix = FilenameUtils.getExtension(file.getName());
				
				File newFile = new File(file.getParentFile(), flay.getFullname() + tail + "." + suffix);
				boolean renameTo = file.renameTo(newFile);
				log.info("renameTo {}: {} - {}", renameTo, file, newFile);
				
				if (renameTo) {
					newFiles.add(newFile);
				} else {
					throw new IllegalStateException("fail to renameTo");
				}
			}
			flay.getFiles().put(key, newFiles);
		}
	}

}
