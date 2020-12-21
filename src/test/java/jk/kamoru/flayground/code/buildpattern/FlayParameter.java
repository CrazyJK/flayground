package jk.kamoru.flayground.code.buildpattern;

import java.util.HashMap;
import java.util.Map;

public class FlayParameter {

	Map<String, String> map;

	private FlayParameter(Map<String, String> map) {
		this.map = map;
	}

	@Override
	public String toString() {
		return "FlayParameter [map=" + map + "]";
	}

	public static abstract class Builder<T> {

		Map<String, String> map;

		public Builder() {
			map = new HashMap<String, String>();
		}

		public T title(String string) {
			map.put("title", string);
			return getThis();
		}

		public T type(String string) {
			map.put("type", string);
			return getThis();
		}

		public T oper(String string) {
			map.put("oper", string);
			return getThis();
		}

		public T desc(String string) {
			map.put("desc", string);
			return getThis();
		}

		protected abstract T getThis();

		public FlayParameter build() {
			return new FlayParameter(map);
		}

	}

	public static class VideoBuilder extends Builder<VideoBuilder> {

		public static class Type {
			public static final String VIDEO = "video";
			public static final String IAMGE = "image";
		}

		public static class Oper {
			public static final String INSERT = "INSERT";
			public static final String DELETE = "DELETE";

		}

		public VideoBuilder video(String string) {
			map.put("video", string);
			return this;
		}

		@Override
		protected VideoBuilder getThis() {
			return this;
		}
	}

	public static class ImageBuilder extends Builder<ImageBuilder> {

		public static class Type {
			public static final String VIDEO = "video";
			public static final String IAMGE = "image";
		}

		public static class Oper {
			public static final String INSERT = "INSERT";
			public static final String DELETE = "DELETE";

		}

		public ImageBuilder image(String string) {
			map.put("image", string);
			return this;
		}

		@Override
		protected ImageBuilder getThis() {
			return this;
		}

	}

}
