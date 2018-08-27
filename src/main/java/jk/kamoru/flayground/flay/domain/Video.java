package jk.kamoru.flayground.flay.domain;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class Video {
	
	// files
	List<File> videoFileList = new ArrayList<>();
	List<File> subtitlesFileList = new ArrayList<>();
	File coverFile;
	File infoFile;
	List<File> candidateFileList = new ArrayList<>();

	// base info
	Studio studio;
	String opus;
	String title;
	List<Actress> actressList;
	String release;

	// extra info
	String overview;
	int playCount;
	int rank;
	List<Tag> tagList;
	
	public void addVideoFile(File file) {
		videoFileList.add(file);
	}
	
	public void addSubtitlesFile(File file) {
		subtitlesFileList.add(file);
	}
	
	public void addCandidates(File file) {
		candidateFileList.add(file);
	}

	public void addTag(Tag tag) {
		tagList.add(tag);
	}

}
