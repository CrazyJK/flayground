package jk.kamoru.flayground.flay.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Map.Entry;

import org.apache.commons.io.FileExistsException;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;

import jk.kamoru.flayground.flay.domain.Flay;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FlayFileHandler {

	public static void rename(Flay flay, List<String> actressList) {
		flay.setActressList(actressList);
		rename(flay);
	}
	
	public static void rename(Flay flay, String studio, String title, List<String> actressList, String release) {
		flay.setStudio(studio);
		flay.setTitle(title);
		flay.setActressList(actressList);
		flay.setRelease(release);
		rename(flay);
	}

	public static void rename(Flay flay) {
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
	
	public static void createDirectory(File directory) {
		try {
			Files.createDirectories(directory.toPath());
		} catch (IOException e) {
			throw new IllegalStateException(e);
		}
	}

	public static void cleanDirectory(File directory) {
		try {
			FileUtils.cleanDirectory(directory);
		} catch (IOException e) {
			throw new IllegalStateException(e);
		}
	}

	public static void deleteDirectory(File directory) {
		try {
			FileUtils.deleteDirectory(directory);
		} catch (IOException e) {
			throw new IllegalStateException(e);
		}
	}

	public static void copyDirectoryToDirectory(File srcDir, File destDir) {
		try {
			FileUtils.copyDirectoryToDirectory(srcDir, destDir);
		} catch (IOException e) {
			throw new IllegalStateException(e);
		}
	}

	public static void copyFileToDirectory(File srcFile, File destFile) {
		try {
			FileUtils.copyFileToDirectory(srcFile, destFile);
		} catch (IOException e) {
			throw new IllegalStateException(e);
		}
	}

	public static void moveFileToDirectory(File file, File dir) {
		try {
			FileUtils.moveFileToDirectory(file, dir, true);
		} catch (FileExistsException e) {
			File destFile = new File(dir, file.getName());
			long srcSize = file.length();
			long destSize = destFile.length();
			if (srcSize == destSize || srcSize < destSize) {
				FileUtils.deleteQuietly(file);
			} else {
				FileUtils.deleteQuietly(destFile);
				moveFileToDirectory(file, dir);
			}
		} catch (IOException e) {
			throw new IllegalStateException("fail to move file:" + file.getName(), e);
		}
	}

}
