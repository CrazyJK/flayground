package jk.kamoru.flayground.flay.domain;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

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
	File infoFile;
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

}
