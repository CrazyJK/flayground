package jk.kamoru.flayground.flay.source;

import java.io.File;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import jk.kamoru.flayground.flay.domain.info.TagInfo;

@Repository
public class TagInfoSource extends JsonInfoSource<TagInfo> {

	private static final String FILE_NAME = "tags.data";
	
	@Value("${path.info}") String infoPath;

	@Override
	File getInfoFile() {
		return new File(infoPath, FILE_NAME);
	}

}
