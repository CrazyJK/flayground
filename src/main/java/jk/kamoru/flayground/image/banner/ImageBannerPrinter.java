package jk.kamoru.flayground.image.banner;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.PrintStream;

import javax.imageio.ImageIO;

import org.springframework.stereotype.Component;

import jk.kamoru.flayground.FlayException;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.image.banner.AnsiColors.BitDepth;

@Component
public class ImageBannerPrinter {

	private static final double[] RGB_WEIGHT = { 0.2126d, 0.7152d, 0.0722d };

	public String get(File imageFile, int width, int height, int margin, boolean invert, BitDepth bitDepth, PixelMode pixelMode) {
		try (ByteArrayOutputStream baos = new ByteArrayOutputStream();) {
			BufferedImage read = resizeImage(ImageIO.read(imageFile), width, 0);
			printBanner(read, margin, invert, bitDepth, pixelMode, new PrintStream(baos));
			return baos.toString(Flayground.ENCODING);
		} catch (Exception e) {
			throw new FlayException("fail to make banner", e);
		}
	}

	private BufferedImage resizeImage(BufferedImage image, int width, int height) {
		if (width < 1) {
			width = 1;
		}
		if (height <= 0) {
			double aspectRatio = (double) width / image.getWidth() * 0.5;
			height = (int) Math.ceil(image.getHeight() * aspectRatio);
		}
		BufferedImage resized = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
		java.awt.Image scaled = image.getScaledInstance(width, height, java.awt.Image.SCALE_DEFAULT);
		resized.getGraphics().drawImage(scaled, 0, 0, null);
		return resized;
	}

	public void printBanner(BufferedImage image, int margin, boolean invert, BitDepth bitDepth, PixelMode pixelMode, PrintStream out) {
		AnsiElement background = invert ? AnsiBackground.BLACK : AnsiBackground.DEFAULT;
		out.print(AnsiOutput.encode(AnsiColor.DEFAULT));
		out.print(AnsiOutput.encode(background));
		out.println();
		out.println();
		AnsiElement lastColor = AnsiColor.DEFAULT;
		AnsiColors colors = new AnsiColors(bitDepth);
		for (int y = 0; y < image.getHeight(); y++) {
			for (int i = 0; i < margin; i++) {
				out.print(" ");
			}
			for (int x = 0; x < image.getWidth(); x++) {
				Color color = new Color(image.getRGB(x, y), false);
				AnsiElement ansiColor = colors.findClosest(color);
				if (ansiColor != lastColor) {
					out.print(AnsiOutput.encode(ansiColor));
					lastColor = ansiColor;
				}
				out.print(getAsciiPixel(color, invert, pixelMode));
			}
			out.println();
		}
		out.print(AnsiOutput.encode(AnsiColor.DEFAULT));
		out.print(AnsiOutput.encode(AnsiBackground.DEFAULT));
		out.println();
	}

	private char getAsciiPixel(Color color, boolean dark, PixelMode pixelMode) {
		char[] pixels = pixelMode.getPixels();
		int increment = (10 / pixels.length) * 10;
		int start = increment * pixels.length;
		double luminance = getLuminance(color, dark);
		for (int i = 0; i < pixels.length; i++) {
			if (luminance >= (start - (i * increment))) {
				return pixels[i];
			}
		}
		return pixels[pixels.length - 1];
	}

	private int getLuminance(Color color, boolean inverse) {
		double luminance = 0.0;
		luminance += getLuminance(color.getRed(), inverse, RGB_WEIGHT[0]);
		luminance += getLuminance(color.getGreen(), inverse, RGB_WEIGHT[1]);
		luminance += getLuminance(color.getBlue(), inverse, RGB_WEIGHT[2]);
		return (int) Math.ceil((luminance / 0xFF) * 100);
	}

	private double getLuminance(int component, boolean inverse, double weight) {
		return (inverse ? 0xFF - component : component) * weight;
	}

	/**
	 * Pixel modes supported by the image banner.
	 */
	public enum PixelMode {

		/**
		 * Use text chars for pixels.
		 */
		TEXT(' ', '.', '*', ':', 'o', '&', '8', '#', '@'),

		/**
		 * Use unicode block chars for pixels.
		 */
		BLOCK(' ', '\u2591', '\u2592', '\u2593', '\u2588');

		private char[] pixels;

		PixelMode(char... pixels) {
			this.pixels = pixels;
		}

		char[] getPixels() {
			return this.pixels;
		}

	}

}
