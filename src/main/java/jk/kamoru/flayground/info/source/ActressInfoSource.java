package jk.kamoru.flayground.info.source;

import java.io.File;
import java.util.List;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Autowired;

import com.fasterxml.jackson.core.type.TypeReference;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.image.domain.Image;
import jk.kamoru.flayground.image.source.ImageSource;
import jk.kamoru.flayground.info.domain.Actress;

public class ActressInfoSource extends InfoSourceJsonAdapter<Actress, String> {

	@Autowired FlayProperties flayProperties;

	@Autowired ImageSource<Image> imageSource;

	@Override
	File getInfoFile() {
		return new File(flayProperties.getInfoPath(), Flayground.InfoFilename.ACTRESS);
	}

	@Override
	public Actress get(String name) {
		Actress actress = super.get(name);
		if (actress.getCovers() == null)
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
		Supplier<Stream<Image>> supplier = () -> imageSource.list().stream().filter(i -> {
			return i.getName().startsWith(name);
		});
		long count = supplier.get().count();
		if (count == 0) {
			return null;
		} else {
			return supplier.get().map(Image::getFile).collect(Collectors.toList());
		}
	}

}
