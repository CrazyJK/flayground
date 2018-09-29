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
			throw new IllegalStateException("fail to createDirectory " + directory, e);
		}
	}

	public static void cleanDirectory(File directory) {
		try {
			FileUtils.cleanDirectory(directory);
		} catch (IOException e) {
			throw new IllegalStateException("fail to cleanDirectory " + directory, e);
		}
	}

	public static void deleteDirectory(File directory) {
		try {
			FileUtils.deleteDirectory(directory);
		} catch (IOException e) {
			throw new IllegalStateException("fail to deleteDirectory " + directory, e);
		}
	}

	public static void copyDirectoryToDirectory(File fromDirectory, File toDirectory) {
		try {
			FileUtils.copyDirectoryToDirectory(fromDirectory, toDirectory);
		} catch (IOException e) {
			throw new IllegalStateException("fail to copyDirectoryToDirectory " + fromDirectory + " to " + toDirectory, e);
		}
	}

	public static void copyFileToDirectory(File file, File directoryr) {
		try {
			FileUtils.copyFileToDirectory(file, directoryr);
		} catch (IOException e) {
			throw new IllegalStateException("fail to copyFileToDirectory " + file + " to " + directoryr, e);
		}
	}

	public static void moveFileToDirectory(File file, File directory) {
		try {
			FileUtils.moveFileToDirectory(file, directory, true);
		} catch (FileExistsException e) {
			File destFile = new File(directory, file.getName());
			long srcSize = file.length();
			long destSize = destFile.length();
			if (srcSize == destSize || srcSize < destSize) {
				FileUtils.deleteQuietly(file);
			} else {
				FileUtils.deleteQuietly(destFile);
				moveFileToDirectory(file, directory);
			}
		} catch (IOException e) {
			throw new IllegalStateException("fail to moveFileToDirectory " + file + " to " + directory, e);
		}
	}

	public static void deleteFile(File file) {
		if (file.isDirectory()) {
			throw new IllegalStateException("fail to deleteFile. it is directory: " + file);
		}
		boolean result = FileUtils.deleteQuietly(file);
		if (!result) {
			throw new IllegalStateException("fail to deleteFile " + file);
		}
	}
	
}