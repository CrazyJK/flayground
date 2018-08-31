package jk.kamoru.flayground.flay.source.info;

import java.io.File;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.type.TypeReference;

import jk.kamoru.flayground.flay.domain.info.Video;

@Repository
public class VideoInfoSource extends JsonInfoSource<Video, String> {

	private static final String FILE_NAME = "video.json";
	
	@Value("${path.info}") String infoPath;

	@Override
	File getInfoFile() {
		return new File(infoPath, FILE_NAME);
	}

	@Override
	TypeReference<List<Video>> getTypeReference() {
		return new TypeReference<List<Video>>() {};
	}

	@Override
	Video newInstance(String key) {
		return new Video(key);
	}

}
