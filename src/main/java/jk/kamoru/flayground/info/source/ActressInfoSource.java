package jk.kamoru.flayground.info.source;

import java.io.File;
import java.util.Collection;
import java.util.List;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.annotation.PostConstruct;

import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.type.TypeReference;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.info.domain.Actress;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Repository
public class ActressInfoSource extends InfoSourceJsonAdapter<Actress, String> {

	@Autowired FlayProperties flayProperties;

	Collection<File> coverPool;

	@Override
	File getInfoFile() {
		return new File(flayProperties.getInfoPath(), Flayground.InfoFilename.ACTRESS);
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
		coverPool = FileUtils.listFiles(new File(flayProperties.getInfoPath()), Flayground.FILE.IMAGE_SUFFIXs, true);
		log.info(String.format("%5s actress cover", coverPool.size()));
	}

}
