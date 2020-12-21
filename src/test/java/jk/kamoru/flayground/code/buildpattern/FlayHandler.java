package jk.kamoru.flayground.code.buildpattern;

import java.util.ArrayList;
import java.util.List;

public class FlayHandler {

	static String httpClient;

	String server;
	String id;
	String pwd;


	private FlayHandler(String server, String id, String pwd) {
		super();
		this.server = server;
		this.id = id;
		this.pwd = pwd;
	}

	public static FlayHandler get(String server, String id, String pwd) {
		if (httpClient == null) {
			httpClient = "httpClient";
			System.out.println("httpClient created");
		}
		return new FlayHandler(server, id, pwd);
	}

	public String execute(FlayParameter parameter) {
		return httpClient + " " + server + " " + id + " " + pwd + " " + parameter;
	}

	public List<String> execute(List<FlayParameter> parameterList) {
		List<String> list = new ArrayList<>();
		for (FlayParameter parameter : parameterList) {
			list.add(httpClient + " " + server + " " + id + " " + pwd + " " + parameter);
		}
		return list;
	}

}
