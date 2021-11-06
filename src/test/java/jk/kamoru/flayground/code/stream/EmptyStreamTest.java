package jk.kamoru.flayground.code.stream;

import java.io.File;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import org.junit.jupiter.api.Test;

public class EmptyStreamTest {

	@Test
	void maxTest() {
		List<File> list = new ArrayList<>();
		long max = list.stream().mapToLong(File::lastModified).max().orElse(-1);
		System.out.println("max " + max);
	}

	@Test
	void sumTest() {
		List<File> list = new ArrayList<>();
		long sum = list.stream().mapToLong(File::length).sum();
		System.out.println("sum " + sum);
	}

	@Test
	void testThrow() {
		List<File> list = new ArrayList<>();
		try {
			long lastModified = list.stream().max(Comparator.comparing(File::lastModified)).get().lastModified();
			System.out.println(lastModified);
		} catch (NoSuchElementException e) {
			System.out.println("Error " + e.getMessage());
		}
	}
}
