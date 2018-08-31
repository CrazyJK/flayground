package jk.kamoru.flayground.flay.domain;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang3.math.NumberUtils;

import jk.kamoru.flayground.flay.domain.info.Actress;
import jk.kamoru.flayground.flay.domain.info.Video;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
public class Flay {

	// key
	String studio;
	String opus;
	String title;
	List<Actress> actressList;
	String release;
	
	// files
	List<File> movieFileList = new ArrayList<>();
	List<File> subtitlesFileList = new ArrayList<>();
	File coverFile;
	List<File> candidateFileList = new ArrayList<>();

	Video video;

	public void addMovieFile(File file) {
		movieFileList.add(file);
	}

	public void addSubtitlesFile(File file) {
		subtitlesFileList.add(file);
	}

	public void addCandidates(File file) {
		candidateFileList.add(file);
	}

	public long getLastModified() {
		return NumberUtils.max(
				getMovieFileList().size() > 0 ? getMovieFileList().stream().max((f1, f2) -> NumberUtils.compare(f1.lastModified(), f2.lastModified())).get().lastModified() : -1, 
				getSubtitlesFileList().size() > 0 ? getSubtitlesFileList().stream().max((f1, f2) -> NumberUtils.compare(f1.lastModified(), f2.lastModified())).get().lastModified() : -1, 
				coverFile.lastModified(), 
				getCandidateFileList().size() > 0 ? getCandidateFileList().stream().max((f1, f2) -> NumberUtils.compare(f1.lastModified(), f2.lastModified())).get().lastModified() : -1
		);
	}

	public long getLength() {
		return getMovieFileList().size() > 0 ? getMovieFileList().stream().mapToLong(f -> f.length()).sum() : -1;
	}
}
