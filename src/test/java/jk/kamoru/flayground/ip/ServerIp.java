package jk.kamoru.flayground.ip;

import java.net.InetAddress;
import java.net.UnknownHostException;

public class ServerIp {

	public static void main(String[] args) throws UnknownHostException {
		InetAddress localHost = InetAddress.getLocalHost();
		String hostname = localHost.getHostName();
		String hostAddress = localHost.getHostAddress();
		System.out.println("Your current IP address  : " + localHost);
		System.out.println("Your current Hostname    : " + hostname);
		System.out.println("Your current HostAddress : " + hostAddress);
	}

}
