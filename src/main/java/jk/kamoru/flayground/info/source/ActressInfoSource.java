package jk.kamoru.flayground.info.source;

import java.io.File;
import java.io.FilenameFilter;
import java.util.Arrays;
import java.util.List;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.type.TypeReference;

import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.info.domain.Actress;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Repository
public class ActressInfoSource extends InfoSourceJsonAdapter<Actress, String> {

	@Value("${path.info}") String infoPath;

	List<File> coverPool;
	
	@Override
	File getInfoFile() {
		return new File(infoPath, Flayground.ACTRESS_FILE_NAME);
	}

	@Override
	public Actress get(String name) {
		Actress actress = super.get(name);
		actress.setCovers(findCoverFile(name));
		return actress;
	}
	
	@Override
	TypeReference<List<Actress>> getTypeReference() {
		return new TypeReference<List<Actress>>() {};
	}

	@Override
	Actress newInstance(String key) {
		return new Actress(key);
	}

	private List<File> findCoverFile(String name) {
		if (coverPool.size() > 0) {
			Supplier<Stream<File>> supplier = () -> coverPool.stream().filter(f -> {
				return f.getName().startsWith(name);
			});
			long count = supplier.get().count();			
			if (count == 0) {
				return null;
			} else {
				return supplier.get().collect(Collectors.toList()); 
			}
		} else { 
			return null;
		}
	}

	@PostConstruct
	void loadCover() {
		coverPool = Arrays.asList(new File(infoPath).listFiles(new FilenameFilter() {
			@Override
			public boolean accept(File dir, String name) {
				for (String suffix : Flayground.SUFFIX_IMAGE.split(",")) {
					if (name.toLowerCase().endsWith(suffix)) {
						return true;
					}
				}
				return false;
			}}));
		log.info(String.format("%5s actress cover", coverPool.size()));
	}
	
}
