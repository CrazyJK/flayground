package jk.kamoru.flayground.code.buildpattern;

import jk.kamoru.flayground.code.buildpattern.FlayParameter.ImageBuilder;
import jk.kamoru.flayground.code.buildpattern.FlayParameter.VideoBuilder;

public class FlayBuilderTest {

	private static final String SERVER = "server";
	private static final String ID = "id";
	private static final String PWD = "pwd";

	public static void main(String[] args) {

		FlayHandler handler = FlayHandler.get(SERVER, ID, PWD);

		for (int i = 0; i < 2; i++) {
			FlayParameter parameter = new FlayParameter.VideoBuilder()
					.title("video " + System.currentTimeMillis())
					.type(VideoBuilder.Type.VIDEO)
					.oper(VideoBuilder.Oper.INSERT)
					.desc("dd")
					.video("video")
					.build();

			String id = handler.execute(parameter);
			System.out.println(id);
		}

		for (int i = 0; i < 2; i++) {
			FlayParameter parameter = new FlayParameter.ImageBuilder()
					.title("iamge " + System.currentTimeMillis())
					.type(ImageBuilder.Type.VIDEO)
					.oper(ImageBuilder.Oper.INSERT)
					.desc("dd")
					.image("image")
					.build();

			String id = handler.execute(parameter);
			System.out.println(id);
		}

	}

}
