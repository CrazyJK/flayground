package jk.kamoru.flayground.flay.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map.Entry;

import org.apache.commons.io.FileExistsException;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.filefilter.IOFileFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.flay.domain.Flay;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class FlayFileHandler {

	@Autowired FlayProperties flayProperties;

	public void rename(Flay flay, List<String> actressList) {
		flay.setActressList(actressList);
		rename(flay);
	}

	public void rename(Flay flay, String studio, String title, List<String> actressList, String release) {
		flay.setStudio(studio);
		flay.setTitle(title);
		flay.setActressList(actressList);
		flay.setRelease(release);
		rename(flay);
	}

	public void rename(Flay flay) {
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

	public void createDirectory(File directory) {
		try {
			Files.createDirectories(directory.toPath());
		} catch (IOException e) {
			throw new IllegalStateException("fail to createDirectory " + directory, e);
		}
	}

	public void cleanDirectory(File directory) {
		try {
			FileUtils.cleanDirectory(directory);
		} catch (IOException e) {
			throw new IllegalStateException("fail to cleanDirectory " + directory, e);
		}
	}

	public void deleteDirectory(File directory) {
		try {
			FileUtils.deleteDirectory(directory);
			log.warn("deleted Directory {}", directory);
		} catch (IOException e) {
			throw new IllegalStateException("fail to deleteDirectory " + directory, e);
		}
	}

	public void copyDirectoryToDirectory(File fromDirectory, File toDirectory) {
		try {
			final long length = FileUtils.listFiles(toDirectory, null, true).stream().mapToLong(f -> f.length()).sum();
			checkDiskSpace(fromDirectory, length);
			FileUtils.copyDirectoryToDirectory(fromDirectory, toDirectory);
		} catch (IOException e) {
			throw new IllegalStateException("fail to copyDirectoryToDirectory " + fromDirectory + " to " + toDirectory, e);
		}
	}

	public void copyFileToDirectory(File file, File directory) {
		try {
			checkDiskSpace(directory, file.length());
			FileUtils.copyFileToDirectory(file, directory);
		} catch (IOException e) {
			throw new IllegalStateException("fail to copyFileToDirectory " + file + " to " + directory, e);
		}
	}

	public void moveFileToDirectory(File file, File directory) {
		try {
			checkDiskSpace(directory, file.length());
			FileUtils.moveFileToDirectory(file, directory, true);
		} catch (FileExistsException e) {
			File destFile = new File(directory, file.getName());
			long srcSize = file.length();
			long destSize = destFile.length();
			if (srcSize == destSize || srcSize < destSize) {
				FileUtils.deleteQuietly(file);
				log.warn("moveFileToDirectory destFile is exist {}. srcFile deleted {}", destFile, file);
			} else {
				FileUtils.deleteQuietly(destFile);
				log.warn("moveFileToDirectory destFile is small {}. destFile deleted", destFile);
				moveFileToDirectory(file, directory);
			}
		} catch (IOException e) {
			throw new IllegalStateException("fail to moveFileToDirectory " + file + " to " + directory, e);
		}
	}

	public void checkDiskSpace(File disk, long length) throws IOException {
		long freeSpace = disk.getFreeSpace();
		if (0 < freeSpace && freeSpace < length) {
			throw new IOException("Disk free space is too small. " + disk + ": " + prettyFileLength(freeSpace) + " < " + prettyFileLength(length));
		}
	}

	public void deleteFile(File file) {
		if (file.isDirectory()) {
			throw new IllegalStateException("fail to deleteFile. it is directory: " + file);
		}
		if (flayProperties.isRecyclebinUse()) {
			moveFileToDirectory(file, new File(file.toPath().getRoot().toFile(), flayProperties.getRecyclebin()));
		} else {
			boolean result = FileUtils.deleteQuietly(file);
			log.warn("deleted File {}", file);
			if (!result) {
				throw new IllegalStateException("fail to deleteFile " + file);
			}
		}
	}


	public String prettyFileLength(long length) {
		if (length > FileUtils.ONE_TB) {
			return Flayground.Format.Number.TB_Format.format((double)length / FileUtils.ONE_TB) + " TB";
		} else if (length > FileUtils.ONE_GB) {
			return Flayground.Format.Number.GB_Format.format((double)length / FileUtils.ONE_GB) + " GB";
		} else if (length > FileUtils.ONE_MB) {
			return Flayground.Format.Number.MB_Format.format((double)length / FileUtils.ONE_MB) + " MB";
		} else if (length > FileUtils.ONE_KB) {
			return Flayground.Format.Number.KB_Format.format((double)length / FileUtils.ONE_KB) + " KB";
		} else {
			return length + "bytes";
		}
	}

	public Collection<File> listDirectory(File path) {
		return  FileUtils.listFilesAndDirs(path, new IOFileFilter() {
			@Override public boolean accept(File file) { return false; }
			@Override public boolean accept(File dir, String name) { return false; }
		}, new IOFileFilter() {
				@Override public boolean accept(File file) { return true; }
				@Override public boolean accept(File dir, String name) { return true; }
		});
	}
}
